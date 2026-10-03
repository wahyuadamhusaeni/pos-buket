<?php

namespace App\Models;

use Database\Factories\PurchaseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property Carbon $tanggal
 * @property int|null $supplier_id
 * @property string|null $no_pesanan
 * @property int $ongkir
 * @property int $diskon
 * @property int $biaya_lain
 * @property string $status draft|diterima|dibatalkan
 * @property string|null $catatan
 * @property int|null $created_by
 * @property Carbon|null $diterima_at
 */
#[Fillable(['tanggal', 'supplier_id', 'no_pesanan', 'ongkir', 'diskon', 'biaya_lain', 'status', 'catatan', 'created_by', 'diterima_at'])]
class Purchase extends Model
{
    /** @use HasFactory<PurchaseFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'ongkir' => 'integer',
            'diskon' => 'integer',
            'biaya_lain' => 'integer',
            'diterima_at' => 'datetime',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Total nilai item sebelum biaya tambahan
     */
    public function getTotalNilaiItemAttribute(): int
    {
        return (int) $this->items->sum(fn (PurchaseItem $i) => $i->qty * $i->harga_satuan);
    }

    /**
     * Biaya yang akan dialokasikan: ongkir + biaya_lain - diskon
     */
    public function getTotalBiayaTambahanAttribute(): int
    {
        return $this->ongkir + $this->biaya_lain - $this->diskon;
    }
}
