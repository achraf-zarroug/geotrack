<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';

use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Controllers\HealthController;
use App\Controllers\SiteController;

$request = new Request();
$response = new Response();
$router = new Router();

$router->get('/api/health', [HealthController::class, 'index']);
$router->get('/api/sites', [SiteController::class, 'index']);
$router->get('/api/sites/search', [SiteController::class, 'search']);
$router->get('/api/sites/meta', [SiteController::class, 'meta']);
$router->post('/api/sites/sync-elasticsearch', [SiteController::class, 'syncElasticsearch']);
$router->get('/api/sites/{id}', [SiteController::class, 'show']);
$router->post('/api/sites', [SiteController::class, 'store']);
$router->put('/api/sites/{id}', [SiteController::class, 'update']);
$router->delete('/api/sites/{id}', [SiteController::class, 'destroy']);
$router->get('/api-docs', function () {
    return Response::json([
        'name' => 'GeoTrack API',
        'version' => '1.2.0',
        'endpoints' => [
            'GET /api/health' => 'Statut du système et diagnostic des dépendances',
            'GET /api/sites' => 'Liste paginée des sites (?page=1&limit=10&city=...&status=...) ou tous (?all=1)',
            'GET /api/sites/meta' => 'Métadonnées (liste des villes, types, statistiques globales)',
            'GET /api/sites/search?q=...' => 'Recherche multi-champs (Elasticsearch + fallback DB)',
            'POST /api/sites/sync-elasticsearch' => 'Indexation complète de tous les sites dans Elasticsearch',
            'GET /api/sites/{id}' => 'Détails d\'un site',
            'POST /api/sites' => 'Création d\'un site',
            'PUT /api/sites/{id}' => 'Mise à jour d\'un site',
            'DELETE /api/sites/{id}' => 'Suppression d\'un site'
        ]
    ]);
});

try {
    $router->dispatch($request, $response);
} catch (Throwable $e) {
    $isLocal = (\App\Core\Container::config('app.env') === 'local');
    $payload = [
        'error' => 'Internal server error',
        'message' => $isLocal ? $e->getMessage() : 'Une erreur interne est survenue.'
    ];
    if ($isLocal) {
        $payload['file'] = $e->getFile() . ':' . $e->getLine();
    }
    Response::json($payload, 500)->send();
}
