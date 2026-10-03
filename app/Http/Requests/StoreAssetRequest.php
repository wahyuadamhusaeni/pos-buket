<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssetRequest extends FormRequest
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
            'jumlah' => ['required', 'integer', 'min:0'],
            'kondisi' => ['required', 'in:baik,rusak,hilang'],
            'tanggal_beli' => ['nullable', 'date'],
            'harga_beli' => ['nullable', 'integer', 'min:0'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'aktif' => ['boolean'],
        ];
    }
}
