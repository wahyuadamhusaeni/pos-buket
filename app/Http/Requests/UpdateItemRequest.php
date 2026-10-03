<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'nama' => ['sometimes', 'required', 'string', 'max:255'],
            'kategori' => ['nullable', 'string', 'max:100'],
            'satuan' => ['sometimes', 'required', 'string', 'max:50'],
            'stok_min' => ['nullable', 'numeric', 'min:0'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,svg,gif', 'max:5120'],
            'foto_url' => ['nullable', 'string', 'max:500'],
            'hapus_foto' => ['nullable', 'boolean'],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'aktif' => ['boolean'],
        ];
    }
}
