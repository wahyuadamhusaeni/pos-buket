<?php

use App\Http\Controllers\AssetController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TemplateController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Items (bahan stok)
    Route::resource('items', ItemController::class);

    // Assets (alat kerja)
    Route::resource('assets', AssetController::class);

    // Suppliers
    Route::resource('suppliers', SupplierController::class);

    // Purchases
    Route::resource('purchases', PurchaseController::class);
    Route::post('purchases/{purchase}/approve', [PurchaseController::class, 'approve'])->name('purchases.approve');
    Route::post('purchases/{purchase}/cancel', [PurchaseController::class, 'cancel'])->name('purchases.cancel');

    // Templates buket
    Route::resource('templates', TemplateController::class);

    // Sales / POS
    Route::resource('sales', SaleController::class)->except(['edit', 'update']);
    Route::post('sales/{sale}/cancel', [SaleController::class, 'cancel'])->name('sales.cancel');
    Route::post('sales/{sale}/payments', [SaleController::class, 'addPayment'])->name('sales.payments.store');
    Route::patch('sales/{sale}/status-pesanan', [SaleController::class, 'updateStatusPesanan'])->name('sales.status-pesanan.update');

    // Stock adjustments & waste
    Route::get('stock/adjustments', [StockAdjustmentController::class, 'index'])->name('stock.adjustments.index');
    Route::post('stock/adjustments', [StockAdjustmentController::class, 'store'])->name('stock.adjustments.store');

    // Reports
    Route::get('reports/sales', [ReportController::class, 'sales'])->name('reports.sales');
    Route::get('reports/stock', [ReportController::class, 'stock'])->name('reports.stock');
    Route::get('reports/purchases', [ReportController::class, 'purchases'])->name('reports.purchases');
    Route::get('reports/waste', [ReportController::class, 'waste'])->name('reports.waste');
    Route::get('reports/inventory', [ReportController::class, 'inventory'])->name('reports.inventory');

    // Settings
    Route::get('settings/business', [SettingController::class, 'index'])->name('settings.business');
    Route::put('settings/business', [SettingController::class, 'update'])->name('settings.business.update');
});

require __DIR__.'/settings.php';
