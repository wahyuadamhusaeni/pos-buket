<?php

namespace App\Models;

use Database\Factories\TemplateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $nama
 * @property int $harga_default
 * @property string|null $foto_url
 * @property string|null $catatan
 * @property bool $aktif
 */
#[Fillable(['nama', 'harga_default', 'foto_url', 'catatan', 'aktif'])]
class Template extends Model
{
    /** @use HasFactory<TemplateFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'harga_default' => 'integer',
            'aktif' => 'boolean',
        ];
    }

    public function templateItems(): HasMany
    {
        return $this->hasMany(TemplateItem::class);
    }

    public function items(): BelongsToMany
    {
        return $this->belongsToMany(Item::class, 'template_items')
            ->withPivot('qty')
            ->withTimestamps();
    }
}
