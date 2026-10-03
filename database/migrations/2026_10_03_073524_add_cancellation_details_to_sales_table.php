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
            $table->text('alasan_batal')->nullable()->after('status');
            $table->string('penanganan_stok')->nullable()->after('alasan_batal'); // restock, ready_stock, waste
            $table->string('penanganan_dp')->nullable()->after('penanganan_stok'); // hangus, refund
            $table->bigInteger('nominal_refund')->default(0)->after('penanganan_dp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'alasan_batal',
                'penanganan_stok',
                'penanganan_dp',
                'nominal_refund',
            ]);
        });
    }
};
