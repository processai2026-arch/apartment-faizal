<?php

declare(strict_types=1);

class AdminInventoryController extends ResourceController
{
    protected string $model = InventoryItem::class;
    protected array $requiredCreate = ['item_name', 'category', 'quantity', 'unit_cost'];
    protected string $entityType = 'inventory';

    public function movement(Request $request): void
    {
        Validator::require($request->all(), ['quantity', 'movement_type']);
        $itemId = (int) $request->params['id'];
        $item = InventoryItem::find($itemId);
        if (!$item) {
            throw new AppException('Inventory item not found', 404);
        }
        $type = Validator::enum((string) $request->input('movement_type'), ['in', 'out', 'adjust'], 'movement_type');
        $qty = (int) $request->input('quantity');
        if ($qty <= 0) {
            throw new AppException('Quantity must be positive', 422);
        }
        Database::transaction(function () use ($itemId, $item, $type, $qty, $request): void {
            $newQty = (int) $item['quantity'];
            $newUsed = (int) $item['used_quantity'];
            if ($type === 'in') {
                $newQty += $qty;
            } elseif ($type === 'out') {
                if ($newQty < $qty) {
                    throw new AppException('Insufficient stock', 409);
                }
                $newQty -= $qty;
                $newUsed += $qty;
            } else {
                $newQty = $qty;
            }
            Database::query('UPDATE inventory_items SET quantity = :quantity, used_quantity = :used_quantity, updated_at = :now WHERE id = :id', [
                'quantity' => $newQty,
                'used_quantity' => $newUsed,
                'now' => db_time(),
                'id' => $itemId,
            ]);
            Database::query(
                'INSERT INTO inventory_movements (inventory_item_id, movement_type, quantity, location, used_by, notes, actor_user_id, created_at)
                 VALUES (:inventory_item_id, :movement_type, :quantity, :location, :used_by, :notes, :actor_user_id, :created_at)',
                [
                    'inventory_item_id' => $itemId,
                    'movement_type' => $type,
                    'quantity' => $qty,
                    'location' => $request->input('location'),
                    'used_by' => $request->input('used_by'),
                    'notes' => $request->input('notes'),
                    'actor_user_id' => $request->user['id'],
                    'created_at' => db_time(),
                ]
            );
        });
        Response::success(InventoryItem::find($itemId), 'Inventory updated');
    }
}
