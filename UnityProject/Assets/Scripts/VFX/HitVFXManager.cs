using System.Collections;
using UnityEngine;

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

        private IEnumerator AnimateSpark(GameObject spark, Vector3 velocity)
        {
            float timer = 0f;
            float lifeTime = 0.22f;
            Vector3 startScale = spark.transform.localScale;

            while (timer < lifeTime)
            {
                timer += Time.deltaTime;
                spark.transform.position += velocity * Time.deltaTime;
                velocity.y -= 25f * Time.deltaTime; // Gravidade
                spark.transform.localScale = Vector3.Lerp(startScale, Vector3.zero, timer / lifeTime);
                yield return null;
            }

            Destroy(spark);
        }
    }
}
