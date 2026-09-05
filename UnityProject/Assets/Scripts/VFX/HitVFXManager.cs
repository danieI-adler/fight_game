using System.Collections;
using UnityEngine;
using FightGame.Combat;

namespace FightGame.VFX
{
    public class HitVFXManager : MonoBehaviour
    {
        public static HitVFXManager Instance;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void SpawnHitSpark(Vector3 position, bool isHeavy, Color themeColor)
        {
            // 1. Flash de Luz Instantâneo (Chiaroscuro)
            GameObject flashObj = new GameObject("HitFlashLight");
            flashObj.transform.position = position;

            Light pLight = flashObj.AddComponent<Light>();
            pLight.type = LightType.Point;
            pLight.color = isHeavy ? Color.white : themeColor;
            pLight.range = isHeavy ? 6f : 3.5f;
            pLight.intensity = isHeavy ? 5f : 2.5f;

            // 2. Faíscas Visuais com Geometria Dinâmica
            int sparkCount = isHeavy ? 12 : 6;
            for (int i = 0; i < sparkCount; i++)
            {
                GameObject spark = GameObject.CreatePrimitive(PrimitiveType.Cube);
                spark.name = "Spark_Shard";
                spark.transform.position = position;
                spark.transform.localScale = Vector3.one * (isHeavy ? 0.09f : 0.05f);
                Destroy(spark.GetComponent<Collider>());

                Material mat = new Material(Shader.Find("Sprites/Default") ?? Shader.Find("Standard"));
                mat.color = isHeavy ? Color.white : themeColor;
                spark.GetComponent<MeshRenderer>().material = mat;

                Vector3 velocity = Random.insideUnitSphere * (isHeavy ? 14f : 8f);
                velocity.z = 0;
                StartCoroutine(AnimateSpark(spark, velocity));
            }

            Destroy(flashObj, 0.15f);
        }

        public void SpawnGunProjectile(Vector3 spawnPos, int direction, Color color, AttackData attack, FighterController owner)
        {
            // Muzzle Flash
            SpawnHitSpark(spawnPos, true, Color.cyan);

            // Projétil de Energia / Bala do Gustave
            GameObject bullet = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            bullet.name = "Gustave_EnergyBullet";
            bullet.transform.position = spawnPos;
            bullet.transform.localScale = new Vector3(0.25f, 0.25f, 0.5f);
            bullet.transform.rotation = Quaternion.Euler(0, direction == 1 ? 90 : -90, 0);
            Destroy(bullet.GetComponent<Collider>());

            Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
            mat.color = Color.cyan;
            mat.EnableKeyword("_EMISSION");
            mat.SetColor("_EmissionColor", Color.cyan * 3.5f);
            bullet.GetComponent<MeshRenderer>().material = mat;

            StartCoroutine(AnimateProjectile(bullet, direction, attack, owner));
        }

        private IEnumerator AnimateProjectile(GameObject bullet, int direction, AttackData attack, FighterController owner)
        {
            float timer = 0f;
            float maxLife = 1.2f;
            float speed = 22f;

            while (timer < maxLife && bullet != null)
            {
                timer += Time.deltaTime;
                bullet.transform.position += Vector3.right * (direction * speed * Time.deltaTime);

                // Colisão com oponente
                if (owner != null && owner.opponent != null)
                {
                    float dist = Vector3.Distance(bullet.transform.position, owner.opponent.transform.position + Vector3.up * 1.0f);
                    if (dist < 0.9f)
                    {
                        owner.opponent.OnReceiveHit(attack, owner);
                        SpawnHitSpark(bullet.transform.position, true, Color.cyan);
                        Destroy(bullet);
                        yield break;
                    }
                }

                yield return null;
            }

            if (bullet != null) Destroy(bullet);
        }

        private IEnumerator AnimateSpark(GameObject spark, Vector3 velocity)
        {
            float timer = 0f;
            float lifeTime = 0.25f;
            Vector3 startScale = spark.transform.localScale;

            while (timer < lifeTime && spark != null)
            {
                timer += Time.deltaTime;
                spark.transform.position += velocity * Time.deltaTime;
                spark.transform.localScale = Vector3.Lerp(startScale, Vector3.zero, timer / lifeTime);
                velocity += Vector3.down * (9.8f * Time.deltaTime);
                yield return null;
            }

            if (spark != null) Destroy(spark);
        }
    }
}
