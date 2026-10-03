<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $sale_id
 * @property Carbon $tanggal
 * @property int $nominal
 * @property string $metode
 * @property string|null $catatan
 */
#[Fillable(['sale_id', 'tanggal', 'nominal', 'metode', 'catatan'])]
class Payment extends Model
{
    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'nominal' => 'integer',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}
