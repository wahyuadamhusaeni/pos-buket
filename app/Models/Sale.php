<?php

namespace App\Models;

use Database\Factories\SaleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property Carbon $tanggal
 * @property string|null $pelanggan
 * @property string|null $telepon_pelanggan
 * @property string|null $catatan
 * @property int $total_harga
 * @property int $total_hpp
 * @property int $total_biaya_tambahan
 * @property string $status_bayar lunas|dp|belum
 * @property string $metode tunai|transfer|lainnya
 * @property int $nominal_dp
 * @property string $status selesai|dibatalkan
 * @property int|null $created_by
 */
#[Fillable(['tanggal', 'pelanggan', 'telepon_pelanggan', 'catatan', 'total_harga', 'total_hpp', 'total_biaya_tambahan', 'status_bayar', 'metode', 'nominal_dp', 'status', 'created_by'])]
class Sale extends Model
{
    /** @use HasFactory<SaleFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'total_harga' => 'integer',
            'total_hpp' => 'integer',
            'total_biaya_tambahan' => 'integer',
            'nominal_dp' => 'integer',
        ];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(SaleLine::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Laba kotor = total_harga - total_hpp - total_biaya_tambahan
     */
    public function getLabaKotorAttribute(): int
    {
        return $this->total_harga - $this->total_hpp - $this->total_biaya_tambahan;
    }

    /**
     * Total paid so far via payments
     */
    public function getTotalTerbayarAttribute(): int
    {
        return (int) $this->payments->sum('nominal');
    }

    /**
     * Sisa piutang
     */
    public function getSisaTagihanAttribute(): int
    {
        return $this->total_harga - $this->total_terbayar;
    }
}
