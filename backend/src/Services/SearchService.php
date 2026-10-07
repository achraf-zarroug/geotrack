<?php
namespace App\Services;

use App\Core\Container;

final class SearchService
{
    private string $baseUrl;
    private string $index = 'sites';

    public function __construct()
    {
        $this->baseUrl = rtrim((string)Container::config('elasticsearch.host'), '/');
    }

    public function isAvailable(): bool
    {
        try {
            $res = $this->request('GET', '/', null, false);
            return isset($res['version']);
        } catch (\Throwable) {
            return false;
        }
    }

    public function ensureIndex(): bool
    {
        try {
            $check = $this->request('GET', "/{$this->index}", null, false);
            if (isset($check['error']) || (isset($check['status']) && $check['status'] === 404)) {
                $mapping = [
                    'mappings' => [
                        'properties' => [
                            'name' => ['type' => 'text'],
                            'city' => ['type' => 'text'],
                            'type' => ['type' => 'text'],
                            'status' => ['type' => 'keyword'],
                            'latitude' => ['type' => 'float'],
                            'longitude' => ['type' => 'float']
                        ]
                    ]
                ];
                $this->request('PUT', "/{$this->index}", $mapping, false);
            }
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public function index(array $site): bool
    {
        try {
            $this->ensureIndex();
            $this->request('PUT', "/{$this->index}/_doc/{$site['id']}", $site, false);
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $this->request('DELETE', "/{$this->index}/_doc/{$id}", null, false);
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public function syncAll(array $sites): int
    {
        $indexed = 0;
        $this->ensureIndex();
        foreach ($sites as $site) {
            if ($this->index($site)) {
                $indexed++;
            }
        }
        return $indexed;
    }

    public function search(string $query): array
    {
        $body = [
            'query' => [
                'multi_match' => [
                    'query' => $query,
                    'fields' => ['name^3', 'city^2', 'type'],
                    'fuzziness' => 'AUTO'
                ]
            ],
            'size' => 50
        ];

        try {
            $result = $this->request('POST', "/{$this->index}/_search", $body, false);
            if (isset($result['hits']['hits']) && is_array($result['hits']['hits'])) {
                return array_map(
                    fn(array $hit) => $hit['_source'] ?? [],
                    $result['hits']['hits']
                );
            }
        } catch (\Throwable) {
            // Silently fallback if Elasticsearch fails
        }
        return [];
    }

    private function request(string $method, string $path, ?array $body = null, bool $required = true): array
    {
        $ch = curl_init($this->baseUrl . $path);
        $headers = ['Content-Type: application/json'];

        $apiKey = Container::config('elasticsearch.api_key');
        if ($apiKey) {
            $headers[] = "Authorization: ApiKey {$apiKey}";
        }

        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 4,
            CURLOPT_CONNECTTIMEOUT => 2
        ];

        $user = Container::config('elasticsearch.user');
        $pass = Container::config('elasticsearch.password');
        if ($user && $pass) {
            $opts[CURLOPT_USERPWD] = "{$user}:{$pass}";
        }

        curl_setopt_array($ch, $opts);
        if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));

        $response = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || ($required && $code >= 400)) {
            if ($required) {
                throw new \RuntimeException('Elasticsearch request failed');
            }
            return [];
        }

        return json_decode($response ?: '{}', true) ?: [];
    }
}
