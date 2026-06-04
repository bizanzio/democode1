pipeline {
    agent any

    parameters {
        string(name: 'PORTAINER_URL',
               defaultValue: 'https://devportainer.viladomat.com',
               description: 'URL base de Portainer, sin barra al final')

        string(name: 'PORTAINER_ENDPOINT_ID',
               defaultValue: '1',
               description: 'ID del endpoint de Portainer (Environments). Normalmente 1')

        string(name: 'REPO_URL',
               defaultValue: 'https://github.com/bizanzio/democode1',
               description: 'URL del repositorio GitHub (sin .git)')

        string(name: 'STACK_NAME',
               defaultValue: 'democode1',
               description: 'Nombre con el que aparecerá el stack en Portainer')

        string(name: 'IMAGE_NAME',
               defaultValue: 'democode1:latest',
               description: 'Nombre:tag de la imagen Docker a construir')

        string(name: 'APP_HOSTNAME',
               defaultValue: 'demoapp1',
               description: 'Hostname que Traefik usará para servir la app')

        string(name: 'DB_HOST',
               defaultValue: '10.42.81.5',
               description: 'Host del servidor de base de datos')

        string(name: 'DB_NAME',
               defaultValue: 'demodb',
               description: 'Nombre de la base de datos')
    }

    // Credenciales en Jenkins → Manage Jenkins → Credentials:
    //   • ID: portainer-admin    → usuario y contraseña de Portainer
    //   • ID: demoapp-dbcreds    → usuario y contraseña de la base de datos

    stages {

        stage('1 · Token Portainer') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'portainer-admin',
                    usernameVariable: 'P_USER',
                    passwordVariable: 'P_PASS'
                )]) {
                    script {
                        def resp = httpRequest(
                            acceptType:      'APPLICATION_JSON',
                            contentType:     'APPLICATION_JSON',
                            httpMode:        'POST',
                            ignoreSslErrors: true,
                            url:             "${params.PORTAINER_URL}/api/auth",
                            requestBody:     """{"Username":"${P_USER}","Password":"${P_PASS}"}"""
                        )
                        def json = new groovy.json.JsonSlurper().parseText(resp.content)
                        env.JWT = "Bearer ${json.jwt}"
                        echo "Token obtenido correctamente"
                    }
                }
            }
        }

        stage('2 · Construir imagen Docker') {
            steps {
                script {
                    sh """
                        tar -czf /tmp/build-context.tar.gz \
                            --exclude='.git' \
                            --exclude='node_modules' \
                            -C ${WORKSPACE} .
                    """

                    def buildUrl = "${params.PORTAINER_URL}/api/endpoints/${params.PORTAINER_ENDPOINT_ID}/docker/build?t=${params.IMAGE_NAME}&nocache=1"

                    sh """
                        curl -sf -X POST \
                          -H 'Content-Type: application/x-tar' \
                          -H 'Authorization: ${env.JWT}' \
                          --data-binary @/tmp/build-context.tar.gz \
                          --insecure \
                          '${buildUrl}'
                    """
                    echo "Imagen ${params.IMAGE_NAME} construida correctamente"
                }
            }
        }

        stage('3 · Eliminar stack anterior') {
            steps {
                script {
                    def resp = httpRequest(
                        httpMode:           'GET',
                        ignoreSslErrors:    true,
                        url:                "${params.PORTAINER_URL}/api/stacks",
                        customHeaders:      [[name: 'Authorization', value: env.JWT]],
                        validResponseCodes: '200'
                    )
                    def stacks   = new groovy.json.JsonSlurper().parseText(resp.content)
                    def existing = stacks?.find { it.Name == params.STACK_NAME }

                    if (existing) {
                        echo "Stack '${params.STACK_NAME}' encontrado (ID: ${existing.Id}). Eliminando..."
                        httpRequest(
                            httpMode:           'DELETE',
                            ignoreSslErrors:    true,
                            url:                "${params.PORTAINER_URL}/api/stacks/${existing.Id}?endpointId=${params.PORTAINER_ENDPOINT_ID}",
                            customHeaders:      [[name: 'Authorization', value: env.JWT]],
                            validResponseCodes: '200:204'
                        )
                        echo "Stack eliminado. Esperando 3s para que Swarm lo libere..."
                        sleep(3)
                    } else {
                        echo "No existe stack previo '${params.STACK_NAME}'. Continuando..."
                    }
                }
            }
        }

        stage('4 · Desplegar stack') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'demoapp-dbcreds',
                    usernameVariable: 'DB_USER',
                    passwordVariable: 'DB_PASS'
                )]) {
                    script {
                        def swarmResp = httpRequest(
                            httpMode:           'GET',
                            ignoreSslErrors:    true,
                            url:                "${params.PORTAINER_URL}/api/endpoints/${params.PORTAINER_ENDPOINT_ID}/docker/swarm",
                            customHeaders:      [[name: 'Authorization', value: env.JWT]],
                            validResponseCodes: '200'
                        )
                        def swarmId = new groovy.json.JsonSlurper().parseText(swarmResp.content).ID
                        echo "Swarm ID: ${swarmId}"

                        // Leemos el docker-compose.yml del workspace (ya clonado por Jenkins)
                        // y escapamos las comillas para meterlo en el JSON
                        def composeContent = readFile('docker-compose.yml')
                                                .replace('\\', '\\\\')
                                                .replace('"', '\\"')
                                                .replace('\n', '\\n')
                                                .replace('\r', '')

                        def body = """
                        {
                          "Name": "${params.STACK_NAME}",
                          "SwarmID": "${swarmId}",
                          "StackFileContent": "${composeContent}",
                          "Env": [
                            {"name": "APP_HOSTNAME",  "value": "${params.APP_HOSTNAME}"},
                            {"name": "DB_HOST",       "value": "${params.DB_HOST}"},
                            {"name": "DB_USER",       "value": "${DB_USER}"},
                            {"name": "DB_PASSWORD",   "value": "${DB_PASS}"},
                            {"name": "DB_NAME",       "value": "${params.DB_NAME}"}
                          ]
                        }
                        """

                        echo "Desplegando stack '${params.STACK_NAME}'..."
                        httpRequest(
                            acceptType:             'APPLICATION_JSON',
                            contentType:            'APPLICATION_JSON',
                            httpMode:               'POST',
                            ignoreSslErrors:        true,
                            url:                    "${params.PORTAINER_URL}/api/stacks/create/swarm/string?endpointId=${params.PORTAINER_ENDPOINT_ID}",
                            customHeaders:          [[name: 'Authorization', value: env.JWT]],
                            requestBody:            body,
                            validResponseCodes:     '200:201',
                            consoleLogResponseBody: true
                        )
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deploy completado → https://${params.APP_HOSTNAME}"
        }
        failure {
            echo "❌ El pipeline ha fallado. Revisa los logs arriba."
        }
    }
}
