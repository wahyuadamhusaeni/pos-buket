<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $item_id
 * @property string $tipe purchase|sale|waste|adjust|reversal
 * @property float $qty positive = masuk, negative = keluar
 * @property int $hpp_per_unit
 * @property int $nilai qty * hpp_per_unit (signed)
 * @property string|null $ref_tipe
 * @property int|null $ref_id
 * @property string|null $alasan
 * @property string|null $catatan
 * @property int|null $created_by
 */
#[Fillable(['item_id', 'tipe', 'qty', 'hpp_per_unit', 'nilai', 'ref_tipe', 'ref_id', 'alasan', 'catatan', 'created_by'])]
class StockMovement extends Model
{
    protected function casts(): array
    {
        return [
            'qty' => 'decimal:4',
            'hpp_per_unit' => 'integer',
            'nilai' => 'integer',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
