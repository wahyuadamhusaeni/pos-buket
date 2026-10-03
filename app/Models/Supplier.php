<?php

namespace App\Models;

use Database\Factories\SupplierFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $nama
 * @property string $platform
 * @property string|null $link
 * @property string|null $kontak
 * @property string|null $catatan
 * @property bool $aktif
 */
#[Fillable(['nama', 'platform', 'link', 'kontak', 'catatan', 'aktif'])]
class Supplier extends Model
{
    /** @use HasFactory<SupplierFactory> */
    use HasFactory;

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }
}
