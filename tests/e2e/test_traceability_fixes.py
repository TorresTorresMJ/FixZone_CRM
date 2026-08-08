"""
Verifies two traceability fixes in src/app.js against the LIVE Supabase project
(there is no staging project for this app — see CLAUDE.md). All rows created
here are prefixed "__TEST__" and are deleted in a `finally` block so nothing
touches real data.

Requires:
  - FIXZONE_TEST_USER / FIXZONE_TEST_PASS env vars (an active employee login)
  - The app served locally, e.g.: python -m http.server 8080   (from repo root)
  - pip install playwright && playwright install chromium

Run:
  python tests/e2e/test_traceability_fixes.py
"""
import os
import sys
import time
from decimal import Decimal
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

BASE_URL = os.environ.get("FIXZONE_BASE_URL", "http://localhost:8080")
USER = os.environ.get("FIXZONE_TEST_USER")
PASS = os.environ.get("FIXZONE_TEST_PASS")
TAG = "__TEST__"

if not USER or not PASS:
    print("ERROR: set FIXZONE_TEST_USER and FIXZONE_TEST_PASS env vars first.")
    sys.exit(1)


def login(page):
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    page.fill("#login-username", USER)
    page.fill("#login-password", PASS)
    page.click("#login-form button[type=submit]")
    # Race the two real outcomes instead of blindly waiting for the dashboard:
    # either login-screen gets hidden (success) or a ".login-error" message appears
    # (wrong credentials) — this turns a silent 15s timeout into a clear failure reason.
    try:
        page.wait_for_selector(".login-error", timeout=8000)
        error_text = page.locator(".login-error").inner_text()
        print(f"ERROR: login failed: {error_text}")
        print("  Check that FIXZONE_TEST_USER/FIXZONE_TEST_PASS are a REAL active employee login,")
        print("  not placeholder text.")
        sys.exit(1)
    except PWTimeout:
        pass  # no error shown within 8s — assume login is proceeding
    page.wait_for_function(
        "document.querySelector('#login-screen')?.style.display === 'none' || "
        "document.querySelector('.app-shell')?.style.display !== 'none'",
        timeout=15000,
    )
    page.wait_for_timeout(1500)  # let reloadState()/render() settle


def js(page, expr):
    # Wrap every call in an async IIFE so bare `await ...` expressions (used all over
    # this file for one-line reads like `(await supabaseClient...).data.stock`) are
    # valid JS — `await` outside an async function body is a SyntaxError.
    # Safe to double-wrap: the setup blocks already pass their own (async () => {...})()
    # IIFEs, and `return <promise>` inside an async function just unwraps it once more.
    return page.evaluate(f"(async () => {{ return ({expr}); }})()")


def cleanup(page, product_id, ticket_id, supply_id, tx_ids):
    js(page, f"""
      (async () => {{
        try {{ await supabaseClient.from("ticket_items").delete().eq("ticket_id", "{ticket_id}"); }} catch(e) {{}}
        try {{ await supabaseClient.from("supply_purchases").delete().eq("id", "{supply_id}"); }} catch(e) {{}}
        try {{ await supabaseClient.from("transactions").delete().in("id", {tx_ids!r}); }} catch(e) {{}}
        try {{ await supabaseClient.from("service_tickets").delete().eq("id", "{ticket_id}"); }} catch(e) {{}}
        try {{ await supabaseClient.from("products").delete().eq("id", "{product_id}"); }} catch(e) {{}}
      }})()
    """)


def test_stock_sync_on_part_edit_after_delivery(page):
    print("\n--- TEST 1: stock sync when editing parts on a delivered ticket ---")
    setup = js(page, f"""
      (async () => {{
        const branchId = await branchIdByName(activeBranchId);
        const {{ data: prod, error: pErr }} = await supabaseClient.from("products").insert({{
          name: "{TAG} Pieza", category: "Refaccion", product_type: "refaccion",
          stock: 50, min_stock: 0, sale_price: 100, branch_id: branchId,
        }}).select().single();
        if (pErr) throw new Error("product insert: " + pErr.message);

        const {{ data: tix, error: tErr }} = await supabaseClient.from("service_tickets").insert({{
          customer_name: "{TAG} Cliente", product_name: "{TAG} Equipo",
          issue_description: "test", stage: "Entregado", priority: "Normal",
          repair_amount: 0, payment_status: "Pendiente", paid_amount: 0,
          branch_id: branchId,
        }}).select().single();
        if (tErr) throw new Error("ticket insert: " + tErr.message);

        await reloadState();
        return {{ productId: prod.id, ticketId: tix.id, tracking: tix.tracking_number }};
      }})()
    """)
    product_id, ticket_id = setup["productId"], setup["ticketId"]
    print(f"  setup: product={product_id} ticket={ticket_id} ({setup['tracking']})")

    try:
        # Open the real edit modal — this wires up the actual add/remove-part
        # click handlers we patched (loadTicketParts()).
        js(page, f'openEditTicket("{ticket_id}")')
        page.wait_for_selector("#ticket-parts-section #part-product-sel", timeout=10000)

        page.select_option("#part-product-sel", product_id)
        page.fill("#part-qty", "5")
        page.click("#add-part-btn")
        page.wait_for_timeout(1200)

        stock_after_add = js(page, f'(await supabaseClient.from("products").select("stock").eq("id","{product_id}").single()).data.stock')
        assert stock_after_add == 45, f"FAIL: expected stock 45 after adding 5 parts to a delivered ticket, got {stock_after_add}"
        print(f"  OK: stock decremented to {stock_after_add} after adding part to Entregado ticket")

        page.click('[data-remove-part]')
        page.wait_for_timeout(1200)

        stock_after_remove = js(page, f'(await supabaseClient.from("products").select("stock").eq("id","{product_id}").single()).data.stock')
        assert stock_after_remove == 50, f"FAIL: expected stock restored to 50 after removing the part, got {stock_after_remove}"
        print(f"  OK: stock restored to {stock_after_remove} after removing part")
        print("TEST 1 PASSED")
    finally:
        js(page, 'closeModal()')
        cleanup(page, product_id, ticket_id, "00000000-0000-0000-0000-000000000000", [])


def test_delete_ticket_preserves_linked_supply_expense(page):
    print("\n--- TEST 2: deleting a ticket must not delete its linked Insumos expense ---")
    setup = js(page, f"""
      (async () => {{
        const branchId = await branchIdByName(activeBranchId);
        const {{ data: prod }} = await supabaseClient.from("products").insert({{
          name: "{TAG} Insumo", category: "Otro", product_type: "insumo",
          stock: 0, min_stock: 0, sale_price: 0, branch_id: branchId,
        }}).select().single();

        const {{ data: tix, error: tixErr }} = await supabaseClient.from("service_tickets").insert({{
          customer_name: "{TAG} Cliente 2", product_name: "{TAG} Equipo 2",
          issue_description: "test", stage: "Recibido", priority: "Normal",
          repair_amount: 0, payment_status: "Pendiente", paid_amount: 0,
          branch_id: branchId,
        }}).select().single();
        if (tixErr) throw new Error("ticket insert: " + tixErr.message);

        const today = new Date().toISOString().slice(0,10);
        const suppId = await findOrCreateSupplier("{TAG} Proveedor");

        // Linked Insumos expense (migration 26 + 50 pattern): a transaction AND a
        // supply_purchases row, both tied to this ticket via ticket_id. Column names
        // must match createRemoteTransaction()/createRemoteSupply() exactly — the real
        // schema uses transaction_date/supplier_id/item_name/total_amount, not the
        // shorter names those JS functions take as their *input* params.
        const {{ data: tx, error: txErr }} = await supabaseClient.from("transactions").insert({{
          transaction_date: today, type: "Egreso", category: "Insumos",
          concept: "{TAG} compra insumo", amount: 250, branch_id: branchId,
          ticket_id: tix.id, created_by: currentEmployeeId(),
        }}).select().single();
        if (txErr) throw new Error("egreso tx insert: " + txErr.message);

        const {{ data: supply, error: supplyErr }} = await supabaseClient.from("supply_purchases").insert({{
          supplier_id: suppId, item_name: "{TAG} Insumo", quantity: 1, total_amount: 250,
          purchase_date: today, product_id: prod.id, transaction_id: tx.id,
          ticket_id: tix.id, branch_id: branchId, created_by: currentEmployeeId(),
        }}).select().single();
        if (supplyErr) throw new Error("supply insert: " + supplyErr.message);

        // A second, UNLINKED-to-supply transaction (e.g. an abono) that SHOULD still
        // be deleted with the ticket — regression check that normal cleanup still works.
        const {{ data: abonoTx, error: abonoErr }} = await supabaseClient.from("transactions").insert({{
          transaction_date: today, type: "Ingreso", category: "Servicio",
          concept: "{TAG} abono", amount: 100, branch_id: branchId,
          ticket_id: tix.id, created_by: currentEmployeeId(),
        }}).select().single();
        if (abonoErr) throw new Error("abono tx insert: " + abonoErr.message);

        await reloadState();
        return {{ productId: prod.id, ticketId: tix.id, supplyId: supply.id, txId: tx.id, abonoTxId: abonoTx.id, tracking: tix.tracking_number }};
      }})()
    """)
    product_id, ticket_id = setup["productId"], setup["ticketId"]
    supply_id, tx_id, abono_tx_id = setup["supplyId"], setup["txId"], setup["abonoTxId"]
    print(f"  setup: ticket={ticket_id} ({setup['tracking']}) supply={supply_id} egreso_tx={tx_id} abono_tx={abono_tx_id}")

    try:
        js(page, f'handleDeleteTicket("{ticket_id}")')
        page.wait_for_selector("#confirm-modal-ok", timeout=10000)
        page.click("#confirm-modal-ok")
        page.wait_for_timeout(2000)

        ticket_gone = js(page, f'(await supabaseClient.from("service_tickets").select("id").eq("id","{ticket_id}")).data.length === 0')
        assert ticket_gone, "FAIL: ticket row still exists after delete"
        print("  OK: ticket row deleted")

        egreso_tx = js(page, f'(await supabaseClient.from("transactions").select("id").eq("id","{tx_id}")).data')
        assert len(egreso_tx) == 1, f"FAIL: linked Insumos Egreso transaction was deleted along with the ticket ({tx_id})"
        print("  OK: linked Insumos Egreso transaction survived")

        supply_row = js(page, f'(await supabaseClient.from("supply_purchases").select("id, ticket_id").eq("id","{supply_id}").single()).data')
        assert supply_row is not None, "FAIL: supply_purchases row was deleted"
        assert supply_row["ticket_id"] is None, f"FAIL: supply_purchases.ticket_id should be unlinked (null), got {supply_row['ticket_id']}"
        print("  OK: supply_purchases row survived, unlinked from the deleted ticket")

        abono_tx = js(page, f'(await supabaseClient.from("transactions").select("id").eq("id","{abono_tx_id}")).data')
        assert len(abono_tx) == 0, "FAIL: regression — the unrelated abono transaction should have been deleted with the ticket, but it still exists"
        print("  OK: unrelated abono transaction was correctly deleted (no regression)")
        print("TEST 2 PASSED")
    finally:
        cleanup(page, product_id, "00000000-0000-0000-0000-000000000000", supply_id, [tx_id, abono_tx_id])


def test_supply_edit_delete_stock_sync(page):
    print("\n--- TEST 3: editing/deleting a supply purchase must keep stock in sync ---")
    setup = js(page, f"""
      (async () => {{
        const branchId = await branchIdByName(activeBranchId);
        const {{ data: prod, error: pErr }} = await supabaseClient.from("products").insert({{
          name: "{TAG} Insumo3", category: "Otro", product_type: "insumo",
          stock: 100, min_stock: 0, sale_price: 0, branch_id: branchId,
        }}).select().single();
        if (pErr) throw new Error("product insert: " + pErr.message);

        const suppId = await findOrCreateSupplier("{TAG} Proveedor3");
        const today = new Date().toISOString().slice(0,10);
        // Insert triggers 15_supply_stock_link.sql's stock-increment trigger automatically —
        // stock should become 100 + 5 = 105 with no JS involved.
        const {{ data: supply, error: sErr }} = await supabaseClient.from("supply_purchases").insert({{
          supplier_id: suppId, item_name: "{TAG} Insumo3", quantity: 5, total_amount: 50,
          purchase_date: today, product_id: prod.id, created_by: currentEmployeeId(), branch_id: branchId,
        }}).select().single();
        if (sErr) throw new Error("supply insert: " + sErr.message);

        await reloadState();
        return {{ productId: prod.id, supplyId: supply.id }};
      }})()
    """)
    product_id, supply_id = setup["productId"], setup["supplyId"]
    print(f"  setup: product={product_id} supply={supply_id}")

    try:
        stock_after_insert = js(page, f'(await supabaseClient.from("products").select("stock").eq("id","{product_id}").single()).data.stock')
        assert stock_after_insert == 105, f"FAIL: expected stock 105 right after insert (trigger), got {stock_after_insert}"
        print(f"  OK: insert trigger brought stock to {stock_after_insert}")

        # Exercise the real fixed function directly — updateRemoteSupply(id, data) —
        # editing quantity 5 -> 8 on the SAME product: should reverse -5 then apply +8.
        js(page, f'''updateRemoteSupply("{supply_id}", {{
          date: new Date().toISOString().slice(0,10), supplier: "{TAG} Proveedor3",
          item: "{TAG} Insumo3", quantity: 8, total: 80, product_id: "{product_id}",
        }})''')
        # The real submit handler calls reloadState() right after updateRemoteSupply()
        # (see saveRemoteRecord) so state.supplies reflects the new quantity before any
        # later action — without this, a subsequent deleteRemoteSupply() would read the
        # stale pre-edit quantity from memory, not a bug in the app but in skipping this step.
        js(page, 'reloadState()')
        stock_after_edit = js(page, f'(await supabaseClient.from("products").select("stock").eq("id","{product_id}").single()).data.stock')
        assert stock_after_edit == 108, f"FAIL: expected stock 108 after editing quantity 5->8 (105-5+8), got {stock_after_edit}"
        print(f"  OK: stock corrected to {stock_after_edit} after editing purchase quantity")

        # Exercise the real deleteRemoteSupply UI flow (shows a confirm dialog).
        js(page, f'deleteRemoteSupply("{supply_id}")')
        page.wait_for_selector("#confirm-modal-ok", timeout=10000)
        page.click("#confirm-modal-ok")
        page.wait_for_timeout(1500)

        stock_after_delete = js(page, f'(await supabaseClient.from("products").select("stock").eq("id","{product_id}").single()).data.stock')
        assert stock_after_delete == 100, f"FAIL: expected stock back to 100 after deleting the purchase (108-8), got {stock_after_delete}"
        print(f"  OK: stock restored to {stock_after_delete} after deleting the purchase")
        print("TEST 3 PASSED")
    finally:
        js(page, f'(async () => {{ try {{ await supabaseClient.from("supply_purchases").delete().eq("id","{supply_id}"); }} catch(e) {{}} try {{ await supabaseClient.from("products").delete().eq("id","{product_id}"); }} catch(e) {{}} }})()')


def test_product_delete_warns_about_links(page):
    print("\n--- TEST 4: deleting a linked product must warn with real counts ---")
    setup = js(page, f"""
      (async () => {{
        const branchId = await branchIdByName(activeBranchId);
        const {{ data: prod, error: pErr }} = await supabaseClient.from("products").insert({{
          name: "{TAG} Insumo4", category: "Otro", product_type: "insumo",
          stock: 10, min_stock: 0, sale_price: 0, branch_id: branchId,
        }}).select().single();
        if (pErr) throw new Error("product insert: " + pErr.message);
        const suppId = await findOrCreateSupplier("{TAG} Proveedor4");
        const {{ data: supply, error: sErr }} = await supabaseClient.from("supply_purchases").insert({{
          supplier_id: suppId, item_name: "{TAG} Insumo4", quantity: 1, total_amount: 10,
          purchase_date: new Date().toISOString().slice(0,10), product_id: prod.id,
          created_by: currentEmployeeId(), branch_id: branchId,
        }}).select().single();
        if (sErr) throw new Error("supply insert: " + sErr.message);
        await reloadState();
        return {{ productId: prod.id, supplyId: supply.id }};
      }})()
    """)
    product_id, supply_id = setup["productId"], setup["supplyId"]
    print(f"  setup: product={product_id} supply={supply_id}")

    try:
        js(page, f'deleteRemoteProduct("{product_id}")')
        page.wait_for_selector("#confirm-modal-message:has-text('vinculado')", timeout=10000)
        message = page.locator("#confirm-modal-message").inner_text()
        assert "1 compra" in message, f"FAIL: expected the warning to mention '1 compra(s) de insumo', got: {message!r}"
        print(f"  OK: warning shown: {message}")
        # Abort the deletion — this test only checks the warning copy, not the delete itself.
        page.click('#confirm-modal form[method=dialog] button')
        page.wait_for_timeout(500)
        print("TEST 4 PASSED")
    finally:
        js(page, f'(async () => {{ try {{ await supabaseClient.from("supply_purchases").delete().eq("id","{supply_id}"); }} catch(e) {{}} try {{ await supabaseClient.from("products").delete().eq("id","{product_id}"); }} catch(e) {{}} }})()')


def test_cancel_ticket_with_supply_refund(page):
    print("\n--- TEST 5: cancelling a ticket offers to refund/return its linked insumo ---")
    setup = js(page, f"""
      (async () => {{
        const branchId = await branchIdByName(activeBranchId);
        const {{ data: prod, error: pErr }} = await supabaseClient.from("products").insert({{
          name: "{TAG} Insumo5", category: "Otro", product_type: "insumo",
          stock: 20, min_stock: 0, sale_price: 0, branch_id: branchId,
        }}).select().single();
        if (pErr) throw new Error("product insert: " + pErr.message);

        const {{ data: tix, error: tErr }} = await supabaseClient.from("service_tickets").insert({{
          customer_name: "{TAG} Cliente5", product_name: "{TAG} Equipo5",
          issue_description: "test", stage: "Recibido", priority: "Normal",
          repair_amount: 0, payment_status: "Pendiente", paid_amount: 0, branch_id: branchId,
        }}).select().single();
        if (tErr) throw new Error("ticket insert: " + tErr.message);

        const suppId = await findOrCreateSupplier("{TAG} Proveedor5");
        const today = new Date().toISOString().slice(0,10);
        // Insert triggers the stock-increment trigger: stock 20 -> 23.
        const {{ data: supply, error: sErr }} = await supabaseClient.from("supply_purchases").insert({{
          supplier_id: suppId, item_name: "{TAG} Insumo5", quantity: 3, total_amount: 300,
          purchase_date: today, product_id: prod.id, ticket_id: tix.id,
          created_by: currentEmployeeId(), branch_id: branchId,
        }}).select().single();
        if (sErr) throw new Error("supply insert: " + sErr.message);

        await reloadState();
        return {{ productId: prod.id, ticketId: tix.id, supplyId: supply.id, tracking: tix.tracking_number }};
      }})()
    """)
    product_id, ticket_id, supply_id = setup["productId"], setup["ticketId"], setup["supplyId"]
    print(f"  setup: ticket={ticket_id} ({setup['tracking']}) product={product_id} supply={supply_id}")

    try:
        stock_before = js(page, f'(await supabaseClient.from("products").select("stock").eq("id","{product_id}").single()).data.stock')
        assert stock_before == 23, f"FAIL: expected stock 23 after purchase insert trigger, got {stock_before}"

        js(page, f'cancelTicket("{ticket_id}")')
        page.wait_for_selector("#ct-supply-returned", timeout=10000)
        page.check("#ct-supply-returned")
        page.select_option("#ct-reason", "Cliente canceló")
        page.click("#ct-confirm")
        page.wait_for_timeout(2000)

        ticket = js(page, f'(await supabaseClient.from("service_tickets").select("stage").eq("id","{ticket_id}").single()).data')
        assert ticket["stage"] == "Cancelado", f"FAIL: expected ticket stage Cancelado, got {ticket['stage']}"
        print("  OK: ticket cancelled")

        stock_after = js(page, f'(await supabaseClient.from("products").select("stock").eq("id","{product_id}").single()).data.stock')
        assert stock_after == 20, f"FAIL: expected stock back to 20 after returning the 3 units to the supplier, got {stock_after}"
        print(f"  OK: stock decremented to {stock_after} for the returned insumo")

        refund_tx = js(page, f'(await supabaseClient.from("transactions").select("*").eq("ticket_id","{ticket_id}").eq("type","Ingreso")).data')
        assert len(refund_tx) == 1, f"FAIL: expected exactly 1 Ingreso refund transaction linked to the ticket, found {len(refund_tx)}"
        assert Decimal(str(refund_tx[0]["amount"])) == Decimal("300"), f"FAIL: expected refund amount 300, got {refund_tx[0]['amount']}"
        print(f"  OK: proveedor refund transaction registered for {refund_tx[0]['amount']}")
        print("TEST 5 PASSED")
    finally:
        js(page, f'''(async () => {{
          try {{ await supabaseClient.from("transactions").delete().eq("ticket_id","{ticket_id}"); }} catch(e) {{}}
          try {{ await supabaseClient.from("supply_purchases").delete().eq("id","{supply_id}"); }} catch(e) {{}}
          try {{ await supabaseClient.from("service_tickets").delete().eq("id","{ticket_id}"); }} catch(e) {{}}
          try {{ await supabaseClient.from("products").delete().eq("id","{product_id}"); }} catch(e) {{}}
        }})()''')


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"  [console:{msg.type}] {msg.text}") if msg.type == "error" else None)
        try:
            login(page)
            test_stock_sync_on_part_edit_after_delivery(page)
            test_delete_ticket_preserves_linked_supply_expense(page)
            test_supply_edit_delete_stock_sync(page)
            test_product_delete_warns_about_links(page)
            test_cancel_ticket_with_supply_refund(page)
            print("\nALL TESTS PASSED")
        finally:
            browser.close()


if __name__ == "__main__":
    main()
