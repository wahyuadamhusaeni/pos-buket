<?php

namespace App\Models;

use Database\Factories\ItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $nama
 * @property string $tipe bunga_hidup|bunga_artifisial|pelengkap|aset
 * @property string|null $kategori
 * @property string $satuan
 * @property float $stok_saat_ini
 * @property int $hpp_rata_rata Rupiah integer
 * @property float $stok_min
 * @property string|null $foto_url
 * @property string|null $catatan
 * @property bool $aktif
 */
#[Fillable(['nama', 'tipe', 'kategori', 'satuan', 'stok_saat_ini', 'hpp_rata_rata', 'stok_min', 'foto_url', 'catatan', 'aktif'])]
class Item extends Model
{
    /** @use HasFactory<ItemFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'stok_saat_ini' => 'float',
            'stok_min' => 'float',
            'hpp_rata_rata' => 'integer',
            'aktif' => 'boolean',
        ];
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function purchaseItems(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function templateItems(): HasMany
    {
        return $this->hasMany(TemplateItem::class);
    }

    public function saleLineItems(): HasMany
    {
        return $this->hasMany(SaleLineItem::class);
    }

    /**
     * Check if this item has stock (only non-aset types)
     */
    public function hasStock(): bool
    {
        return $this->tipe !== 'aset';
    }

    /**
     * Check if stock is running low
     */
    public function isLowStock(): bool
    {
        return $this->hasStock() && $this->stok_saat_ini <= $this->stok_min;
    }

    /**
     * Get the total inventory value: qty * HPP
     */
    public function getNilaiPersediaanAttribute(): int
    {
        return (int) ($this->stok_saat_ini * $this->hpp_rata_rata);
    }
}
