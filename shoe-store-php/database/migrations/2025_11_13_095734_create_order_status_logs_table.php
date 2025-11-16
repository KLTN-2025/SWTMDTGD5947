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
        Schema::create('order_status_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('orderId');
            $table->enum('oldStatus', ['PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'])->nullable();
            $table->enum('newStatus', ['PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED']);
            $table->unsignedBigInteger('changedBy')->nullable(); // admin_id
            $table->text('note')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            
            $table->foreign('orderId')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('changedBy')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['orderId', 'createdAt']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_status_logs');
    }
};
