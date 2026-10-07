<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Repositories\SiteRepository;
use App\Services\SearchService;

final class SiteController
{
    private SiteRepository $repository;
    private SearchService $search;

    public function __construct()
    {
        $this->repository = new SiteRepository();
        $this->search = new SearchService();
    }

    public function index(Request $request): Response
    {
        $all = $request->query('all');
        if ($all === 'true' || $all === '1') {
            return Response::json(['data' => $this->repository->all()]);
        }

        $page = max(1, (int)$request->query('page', 1));
        $limit = min(100, max(1, (int)$request->query('limit', 10)));
        $city = $request->query('city') ? trim((string)$request->query('city')) : null;
        $status = $request->query('status') ? trim((string)$request->query('status')) : null;

        return Response::json($this->repository->paginate($page, $limit, $city, $status));
    }

    public function meta(): Response
    {
        return Response::json($this->repository->meta());
    }

    public function show(Request $request, string $id): Response
    {
        $site = $this->repository->find((int)$id);
        return $site
            ? Response::json(['data' => $site])
            : Response::json(['error' => 'Site introuvable'], 404);
    }

    public function store(Request $request): Response
    {
        $payload = $request->json();
        $errors = $this->validate($payload);
        if (!empty($errors)) {
            return Response::json(['error' => 'Données invalides', 'details' => $errors], 400);
        }

        $data = $this->sanitize($payload);
        $site = $this->repository->create($data);
        $this->search->index($site);

        return Response::json([
            'message' => 'Site créé avec succès',
            'data' => $site
        ], 201);
    }

    public function update(Request $request, string $id): Response
    {
        $existing = $this->repository->find((int)$id);
        if (!$existing) {
            return Response::json(['error' => 'Site introuvable'], 404);
        }

        $payload = $request->json();
        $errors = $this->validate($payload);
        if (!empty($errors)) {
            return Response::json(['error' => 'Données invalides', 'details' => $errors], 400);
        }

        $data = $this->sanitize($payload);
        $site = $this->repository->update((int)$id, $data);
        $this->search->index($site);

        return Response::json([
            'message' => 'Site mis à jour avec succès',
            'data' => $site
        ]);
    }

    public function destroy(Request $request, string $id): Response
    {
        $existing = $this->repository->find((int)$id);
        if (!$existing) {
            return Response::json(['error' => 'Site introuvable'], 404);
        }

        $this->repository->delete((int)$id);
        $this->search->delete((int)$id);

        return Response::json(['message' => 'Site supprimé avec succès']);
    }

    public function search(Request $request): Response
    {
        $query = trim((string)$request->query('q', ''));
        if ($query === '') {
            return Response::json(['data' => [], 'source' => 'none', 'count' => 0]);
        }

        $source = 'elasticsearch';
        $results = [];
        try {
            $results = $this->search->search($query);
        } catch (\Throwable) {
            $results = [];
        }

        if (empty($results)) {
            $results = $this->repository->search($query);
            $source = 'database_fallback';
        }

        return Response::json([
            'data' => $results,
            'source' => $source,
            'count' => count($results)
        ]);
    }

    public function syncElasticsearch(): Response
    {
        $sites = $this->repository->all();
        $synced = $this->search->syncAll($sites);

        return Response::json([
            'message' => "Indexation terminée : {$synced}/" . count($sites) . " site(s) synchronisé(s)",
            'total' => count($sites),
            'synced' => $synced
        ]);
    }

    private function validate(array $data): array
    {
        $errors = [];
        $required = ['name' => 'Nom du site', 'city' => 'Ville', 'type' => 'Type de site', 'status' => 'Statut'];

        foreach ($required as $field => $label) {
            if (empty(trim((string)($data[$field] ?? '')))) {
                $errors[$field] = "Le champ '{$label}' est obligatoire.";
            }
        }

        $status = strtolower((string)($data['status'] ?? ''));
        if (!empty($status) && !in_array($status, ['active', 'inactive'], true)) {
            $errors['status'] = "Le statut doit être 'active' ou 'inactive'.";
        }

        if (isset($data['latitude']) && $data['latitude'] !== null && $data['latitude'] !== '') {
            if (!is_numeric($data['latitude']) || (float)$data['latitude'] < -90 || (float)$data['latitude'] > 90) {
                $errors['latitude'] = 'La latitude doit être un nombre valide entre -90 et 90.';
            }
        }

        if (isset($data['longitude']) && $data['longitude'] !== null && $data['longitude'] !== '') {
            if (!is_numeric($data['longitude']) || (float)$data['longitude'] < -180 || (float)$data['longitude'] > 180) {
                $errors['longitude'] = 'La longitude doit être un nombre valide entre -180 et 180.';
            }
        }

        return $errors;
    }

    private function sanitize(array $data): array
    {
        return [
            'name' => trim((string)$data['name']),
            'city' => trim((string)$data['city']),
            'type' => trim((string)$data['type']),
            'status' => strtolower((string)$data['status']),
            'latitude' => (isset($data['latitude']) && $data['latitude'] !== '' && $data['latitude'] !== null) ? (float)$data['latitude'] : null,
            'longitude' => (isset($data['longitude']) && $data['longitude'] !== '' && $data['longitude'] !== null) ? (float)$data['longitude'] : null,
        ];
    }
}
