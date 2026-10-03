<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();
            $table->decimal('qty', 15, 4);
            $table->bigInteger('harga_satuan'); // price per unit in Rp
            $table->bigInteger('alokasi_biaya')->default(0); // proportional shipping/other cost allocation
            $table->bigInteger('harga_efektif')->default(0); // (nilai_item + alokasi_biaya) / qty
            // Input alternative: satuan_input, qty_per_satuan for e.g. "2 ikat @ 20 tangkai"
            $table->string('satuan_input')->nullable();
            $table->decimal('qty_per_satuan', 15, 4)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
    }
};
