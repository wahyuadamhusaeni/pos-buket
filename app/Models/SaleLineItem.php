<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $sale_line_id
 * @property int $item_id
 * @property float $qty
 * @property int $hpp_snapshot HPP rata-rata at moment of sale (immutable)
 */
#[Fillable(['sale_line_id', 'item_id', 'qty', 'hpp_snapshot'])]
class SaleLineItem extends Model
{
    protected function casts(): array
    {
        return [
            'qty' => 'decimal:4',
            'hpp_snapshot' => 'integer',
        ];
    }

    public function saleLine(): BelongsTo
    {
        return $this->belongsTo(SaleLine::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Nilai HPP komponen ini = qty * hpp_snapshot
     */
    public function getNilaiHppAttribute(): int
    {
        return (int) ($this->qty * $this->hpp_snapshot);
    }
}
