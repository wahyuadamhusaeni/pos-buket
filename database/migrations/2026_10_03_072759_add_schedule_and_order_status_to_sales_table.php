<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->enum('jenis_pesanan', ['langsung', 'preorder'])->default('langsung')->after('tanggal');
            $table->date('tanggal_ambil')->nullable()->after('jenis_pesanan');
            $table->string('jam_ambil', 20)->nullable()->after('tanggal_ambil');
            $table->enum('tipe_pengiriman', ['pickup', 'delivery'])->default('pickup')->after('jam_ambil');
            $table->enum('status_pesanan', ['antrean', 'proses', 'siap', 'selesai', 'dibatalkan'])->default('selesai')->after('nominal_dp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'jenis_pesanan',
                'tanggal_ambil',
                'jam_ambil',
                'tipe_pengiriman',
                'status_pesanan',
            ]);
        });
    }
};
