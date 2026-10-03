<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
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
            'pelanggan' => ['nullable', 'string', 'max:255'],
            'telepon_pelanggan' => ['nullable', 'string', 'max:20'],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'status_bayar' => ['required', 'in:lunas,dp,belum'],
            'metode' => ['required', 'in:tunai,transfer,lainnya'],
            'nominal_dp' => ['nullable', 'integer', 'min:0'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.nama_buket' => ['required', 'string', 'max:255'],
            'lines.*.template_id' => ['nullable', 'exists:templates,id'],
            'lines.*.harga_jual' => ['required', 'integer', 'min:0'],
            'lines.*.biaya_tambahan' => ['nullable', 'integer', 'min:0'],
            'lines.*.components' => ['required', 'array', 'min:1'],
            'lines.*.components.*.item_id' => ['required', 'exists:items,id'],
            'lines.*.components.*.qty' => ['required', 'numeric', 'min:0.001'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'lines.required' => 'Minimal 1 buket harus ditambahkan',
            'lines.*.nama_buket.required' => 'Nama buket wajib diisi',
            'lines.*.harga_jual.required' => 'Harga jual wajib diisi',
            'lines.*.components.required' => 'Minimal 1 komponen harus ditambahkan',
        ];
    }
}
