<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $sale_id
 * @property string $nama_buket
 * @property int|null $template_id
 * @property int $harga_jual
 * @property int $hpp_total
 * @property int $biaya_tambahan
 * @property float|null $margin_persen
 */
#[Fillable(['sale_id', 'nama_buket', 'template_id', 'harga_jual', 'hpp_total', 'biaya_tambahan', 'margin_persen'])]
class SaleLine extends Model
{
    protected function casts(): array
    {
        return [
            'harga_jual' => 'integer',
            'hpp_total' => 'integer',
            'biaya_tambahan' => 'integer',
            'margin_persen' => 'decimal:2',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(SaleLineItem::class);
    }

    /**
     * Laba kotor baris ini
     */
    public function getLabaKotorAttribute(): int
    {
        return $this->harga_jual - $this->hpp_total - $this->biaya_tambahan;
    }
}
