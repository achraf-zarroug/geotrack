<?php
namespace App\Repositories;

use App\Core\Database;
use PDO;

final class SiteRepository
{
    private PDO $db;

    public function __construct() { $this->db = Database::connection(); }

    public function paginate(int $page, int $limit, ?string $city, ?string $status): array
    {
        $where = [];
        $params = [];

        if ($city) { $where[] = 'city = :city'; $params['city'] = $city; }
        if ($status) { $where[] = 'status = :status'; $params['status'] = $status; }

        $sqlWhere = $where ? ' WHERE ' . implode(' AND ', $where) : '';
        $count = $this->db->prepare("SELECT COUNT(*) FROM sites{$sqlWhere}");
        $count->execute($params);
        $total = (int)$count->fetchColumn();

        $offset = ($page - 1) * $limit;
        $stmt = $this->db->prepare("SELECT * FROM sites{$sqlWhere} ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
        foreach ($params as $key => $value) $stmt->bindValue(":{$key}", $value);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'data' => $stmt->fetchAll(),
            'meta' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => $limit ? (int)ceil($total / $limit) : 0
            ]
        ];
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM sites WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): array
    {
        $stmt = $this->db->prepare(
            'INSERT INTO sites (name, city, type, status, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['name'], $data['city'], $data['type'], $data['status'],
            $data['latitude'], $data['longitude']
        ]);
        return $this->find((int)$this->db->lastInsertId());
    }

    public function update(int $id, array $data): array
    {
        $stmt = $this->db->prepare(
            'UPDATE sites SET name=?, city=?, type=?, status=?, latitude=?, longitude=? WHERE id=?'
        );
        $stmt->execute([
            $data['name'], $data['city'], $data['type'], $data['status'],
            $data['latitude'], $data['longitude'], $id
        ]);
        return $this->find($id);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM sites WHERE id = ?');
        $stmt->execute([$id]);
    }

    public function all(): array
    {
        $stmt = $this->db->query('SELECT * FROM sites ORDER BY created_at DESC');
        return $stmt->fetchAll();
    }

    public function search(string $query): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM sites WHERE name LIKE :q OR city LIKE :q OR type LIKE :q ORDER BY created_at DESC LIMIT 50'
        );
        $stmt->execute(['q' => "%{$query}%"]);
        return $stmt->fetchAll();
    }

    public function meta(): array
    {
        $citiesStmt = $this->db->query('SELECT DISTINCT city FROM sites ORDER BY city ASC');
        $cities = $citiesStmt->fetchAll(PDO::FETCH_COLUMN);

        $typesStmt = $this->db->query('SELECT DISTINCT type FROM sites ORDER BY type ASC');
        $types = $typesStmt->fetchAll(PDO::FETCH_COLUMN);

        $statsStmt = $this->db->query("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_count
            FROM sites
        ");
        $stats = $statsStmt->fetch() ?: ['total' => 0, 'active_count' => 0, 'inactive_count' => 0];

        return [
            'cities' => $cities,
            'types' => $types,
            'stats' => [
                'total' => (int)($stats['total'] ?? 0),
                'active' => (int)($stats['active_count'] ?? 0),
                'inactive' => (int)($stats['inactive_count'] ?? 0),
                'cities_count' => count($cities)
            ]
        ];
    }
}
