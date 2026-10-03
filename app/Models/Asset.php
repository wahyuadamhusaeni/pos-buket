<?php

namespace App\Models;

use Database\Factories\AssetFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $nama
 * @property int $jumlah
 * @property string $kondisi baik|rusak|hilang
 * @property Carbon|null $tanggal_beli
 * @property int|null $harga_beli
 * @property string|null $lokasi
 * @property string|null $catatan
 * @property bool $aktif
 */
#[Fillable(['nama', 'jumlah', 'kondisi', 'tanggal_beli', 'harga_beli', 'lokasi', 'catatan', 'aktif'])]
class Asset extends Model
{
    /** @use HasFactory<AssetFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'tanggal_beli' => 'date',
            'harga_beli' => 'integer',
            'jumlah' => 'integer',
            'aktif' => 'boolean',
        ];
    }
}
