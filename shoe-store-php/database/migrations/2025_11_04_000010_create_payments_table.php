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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('orderId');
            $table->enum('status', ['PENDING', 'UNPAID', 'PAID', 'CANCELLED', 'REFUNDED', 'FAILED'])->default('PENDING');
            $table->float('amount');
            $table->string('transactionCode', 100)->nullable();
            $table->string('accountNumber', 100)->nullable();
            $table->string('bankCode', 100)->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            
            $table->foreign('orderId')->references('id')->on('orders')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
