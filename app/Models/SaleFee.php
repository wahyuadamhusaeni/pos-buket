<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $sale_id
 * @property string $nama
 * @property int $nominal
 * @property string|null $catatan
 */
#[Fillable(['sale_id', 'nama', 'nominal', 'catatan'])]
class SaleFee extends Model
{
    protected function casts(): array
    {
        return [
            'nominal' => 'integer',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}
