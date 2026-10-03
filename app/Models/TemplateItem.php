<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $template_id
 * @property int $item_id
 * @property float $qty
 */
#[Fillable(['template_id', 'item_id', 'qty'])]
class TemplateItem extends Model
{
    protected function casts(): array
    {
        return [
            'qty' => 'decimal:4',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
