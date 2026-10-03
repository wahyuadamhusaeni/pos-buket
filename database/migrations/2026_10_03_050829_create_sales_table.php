<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal');
            $table->string('pelanggan')->nullable();
            $table->string('telepon_pelanggan')->nullable();
            $table->text('catatan')->nullable();
            $table->bigInteger('total_harga')->default(0); // sum of sale_lines harga_jual
            $table->bigInteger('total_hpp')->default(0); // sum of sale_lines hpp_total
            $table->bigInteger('total_biaya_tambahan')->default(0);
            $table->enum('status_bayar', ['lunas', 'dp', 'belum'])->default('belum');
            $table->enum('metode', ['tunai', 'transfer', 'lainnya'])->default('tunai');
            $table->bigInteger('nominal_dp')->default(0);
            $table->enum('status', ['selesai', 'dibatalkan'])->default('selesai');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
