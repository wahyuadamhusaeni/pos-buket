<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'tipe' => ['required', 'in:adjust,waste'],
            'arah' => ['required', 'in:plus,minus'],
            'item_id' => ['required', 'exists:items,id'],
            'qty' => ['required', 'numeric', 'min:0.001'],
            'alasan' => ['required', 'string', 'max:255'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
