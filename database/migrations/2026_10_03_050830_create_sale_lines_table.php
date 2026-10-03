<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->string('nama_buket');
            $table->foreignId('template_id')->nullable()->constrained('templates')->nullOnDelete();
            $table->bigInteger('harga_jual');
            $table->bigInteger('hpp_total')->default(0); // snapshot at time of sale
            $table->bigInteger('biaya_tambahan')->default(0); // extra non-stock costs (delivery fee, etc.)
            $table->decimal('margin_persen', 8, 2)->nullable(); // computed: (harga_jual - hpp_total) / harga_jual * 100
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_lines');
    }
};
