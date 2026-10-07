<?php
namespace App\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Services\SearchService;

final class HealthController
{
    public function index(): Response
    {
        $dbStatus = 'error';
        $siteCount = 0;
        try {
            $db = Database::connection();
            $stmt = $db->query('SELECT COUNT(*) FROM sites');
            $siteCount = (int)$stmt->fetchColumn();
            $dbStatus = 'connected';
        } catch (\Throwable $e) {
            $isLocal = (\App\Core\Container::config('app.env') === 'local');
            $dbStatus = $isLocal ? ('disconnected: ' . $e->getMessage()) : 'disconnected';
        }

        $search = new SearchService();
        $esStatus = $search->isAvailable() ? 'connected' : 'disconnected';

        $isHealthy = ($dbStatus === 'connected');

        return Response::json([
            'status' => $isHealthy ? 'healthy' : 'degraded',
            'service' => 'GeoTrack API',
            'version' => '1.2.0',
            'components' => [
                'database' => [
                    'status' => $dbStatus,
                    'sites_count' => $siteCount
                ],
                'elasticsearch' => [
                    'status' => $esStatus
                ],
                'php_version' => PHP_VERSION,
                'server_time' => date(DATE_ATOM)
            ]
        ], $isHealthy ? 200 : 503);
    }
}
