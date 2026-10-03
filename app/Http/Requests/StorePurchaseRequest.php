<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'tanggal' => ['required', 'date'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'no_pesanan' => ['nullable', 'string', 'max:100'],
            'ongkir' => ['nullable', 'integer', 'min:0'],
            'diskon' => ['nullable', 'integer', 'min:0'],
            'biaya_lain' => ['nullable', 'integer', 'min:0'],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'exists:items,id'],
            'items.*.qty' => ['required', 'numeric', 'min:0.001'],
            'items.*.harga_satuan' => ['required', 'integer', 'min:0'],
            'items.*.satuan_input' => ['nullable', 'string', 'max:50'],
            'items.*.qty_per_satuan' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'items.required' => 'Minimal 1 item harus ditambahkan',
            'items.*.item_id.required' => 'Item wajib dipilih',
            'items.*.qty.required' => 'Jumlah wajib diisi',
            'items.*.harga_satuan.required' => 'Harga satuan wajib diisi',
        ];
    }
}
