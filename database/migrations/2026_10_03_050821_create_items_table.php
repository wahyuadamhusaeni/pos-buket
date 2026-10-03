<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->enum('tipe', ['bunga_hidup', 'bunga_artifisial', 'pelengkap', 'aset']);
            $table->string('kategori')->nullable();
            $table->string('satuan')->default('tangkai');
            $table->decimal('stok_saat_ini', 15, 4)->default(0); // cache, source of truth = stock_movements
            $table->bigInteger('hpp_rata_rata')->default(0); // rupiah as integer (cents avoided, use full Rp)
            $table->decimal('stok_min', 15, 4)->default(0);
            $table->string('foto_url')->nullable();
            $table->text('catatan')->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();

            $table->unique(['nama', 'tipe']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
