<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->integer('jumlah')->default(1);
            $table->enum('kondisi', ['baik', 'rusak', 'hilang'])->default('baik');
            $table->date('tanggal_beli')->nullable();
            $table->bigInteger('harga_beli')->nullable(); // Rp integer
            $table->string('lokasi')->nullable();
            $table->text('catatan')->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
