<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:255'],
            'platform' => ['required', 'in:shopee,tokopedia,offline,lainnya'],
            'link' => ['nullable', 'string', 'max:500'],
            'kontak' => ['nullable', 'string', 'max:100'],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'aktif' => ['boolean'],
        ];
    }
}
