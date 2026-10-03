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
            'jenis_pesanan' => ['nullable', 'in:langsung,preorder'],
            'tanggal_ambil' => ['nullable', 'date'],
            'jam_ambil' => ['nullable', 'string', 'max:20'],
            'tipe_pengiriman' => ['nullable', 'in:pickup,delivery'],
            'status_pesanan' => ['nullable', 'in:antrean,proses,siap,selesai,dibatalkan'],
            'pelanggan' => ['nullable', 'string', 'max:255'],
            'telepon_pelanggan' => ['nullable', 'string', 'max:20'],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'status_bayar' => ['required', 'in:lunas,dp,belum'],
            'metode' => ['nullable', 'required_if:status_bayar,lunas,dp', 'in:tunai,transfer,lainnya'],
            'nominal_dp' => ['nullable', 'required_if:status_bayar,dp', 'integer', 'min:0'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.nama_buket' => ['required', 'string', 'max:255'],
            'lines.*.template_id' => ['nullable', 'exists:templates,id'],
            'lines.*.harga_jual' => ['required', 'integer', 'min:0'],
            'lines.*.biaya_tambahan' => ['nullable', 'integer', 'min:0'],
            'lines.*.components' => ['required', 'array', 'min:1'],
            'lines.*.components.*.item_id' => ['required', 'exists:items,id'],
            'lines.*.components.*.qty' => ['required', 'numeric', 'min:0.001'],
            'fees' => ['nullable', 'array'],
            'fees.*.nama' => ['nullable', 'string', 'max:255'],
            'fees.*.nominal' => ['nullable', 'integer', 'min:0'],
            'fees.*.catatan' => ['nullable', 'string', 'max:255'],
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
