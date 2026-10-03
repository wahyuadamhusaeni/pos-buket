<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $purchase_id
 * @property int $item_id
 * @property float $qty
 * @property int $harga_satuan
 * @property int $alokasi_biaya
 * @property int $harga_efektif (nilai_item + alokasi_biaya) / qty
 * @property string|null $satuan_input
 * @property float|null $qty_per_satuan
 */
#[Fillable(['purchase_id', 'item_id', 'qty', 'harga_satuan', 'alokasi_biaya', 'harga_efektif', 'satuan_input', 'qty_per_satuan'])]
class PurchaseItem extends Model
{
    protected function casts(): array
    {
        return [
            'qty' => 'float',
            'qty_per_satuan' => 'float',
            'harga_satuan' => 'integer',
            'alokasi_biaya' => 'integer',
            'harga_efektif' => 'integer',
        ];
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Nilai item = qty * harga_satuan
     */
    public function getNilaiAttribute(): int
    {
        return (int) ($this->qty * $this->harga_satuan);
    }
}
