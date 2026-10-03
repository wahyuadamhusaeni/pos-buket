<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();
            $table->enum('tipe', ['purchase', 'sale', 'waste', 'adjust', 'reversal']);
            $table->decimal('qty', 15, 4); // positive = masuk, negative = keluar
            $table->bigInteger('hpp_per_unit'); // HPP rata-rata item at time of movement
            $table->bigInteger('nilai'); // qty * hpp_per_unit (signed)
            $table->string('ref_tipe')->nullable(); // e.g. 'purchase', 'sale', 'sale_line'
            $table->unsignedBigInteger('ref_id')->nullable(); // foreign id depending on ref_tipe
            $table->string('alasan')->nullable();
            $table->text('catatan')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['item_id', 'created_at']);
            $table->index(['ref_tipe', 'ref_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
