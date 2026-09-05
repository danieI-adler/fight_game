using UnityEngine;

namespace FightGame.CameraSystem
{
    public class CombatCamera : MonoBehaviour
    {
        public Transform player1;
        public Transform player2;

        [Header("Configurações de Enquadramento")]
        public float minDistance = 6f;
        public float maxDistance = 14f;
        public float zoomMultiplier = 1.2f;
        public float yOffset = 1.8f;
        public float smoothSpeed = 6f;

        [Header("Camera Shake")]
        private float shakeTime = 0f;
        private float shakeIntensity = 0f;

        private void LateUpdate()
        {
            if (player1 == null || player2 == null) return;

            // Ponto central entre os dois lutadores
            Vector3 midPoint = (player1.position + player2.position) * 0.5f;
            float distance = Mathf.Abs(player1.position.x - player2.position.x);

            float targetZ = -Mathf.Clamp(distance * zoomMultiplier, minDistance, maxDistance);
            Vector3 targetPosition = new Vector3(midPoint.x, midPoint.y + yOffset, targetZ);

            // Aplicação de Shake dinâmico
            if (shakeTime > 0)
            {
                shakeTime -= Time.deltaTime;
                Vector3 shakeOffset = Random.insideUnitSphere * shakeIntensity;
                shakeOffset.z = 0;
                targetPosition += shakeOffset;
            }

            transform.position = Vector3.Lerp(transform.position, targetPosition, Time.deltaTime * smoothSpeed);
        }

        public void AddShake(float intensity, float duration)
        {
            shakeIntensity = intensity;
            shakeTime = duration;
        }
    }
}
