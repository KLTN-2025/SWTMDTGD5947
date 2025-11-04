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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('skuId', 50)->unique();
            $table->string('name', 50);
            $table->enum('status', ['SOLD_OUT', 'IN_STOCK', 'PRE_SALE'])->default('IN_STOCK');
            $table->text('description')->nullable();
            $table->float('basePrice');
            $table->integer('quantity')->default(0);
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
