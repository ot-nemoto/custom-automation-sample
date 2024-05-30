import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsp from 'aws-cdk-lib/aws-ecs-patterns';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class CustomAutomationSampleStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const ecs_service = new ecsp.ApplicationLoadBalancedFargateService(
            this,
            'MyWebServer',
            {
                taskImageOptions: {
                    image: ecs.ContainerImage.fromRegistry(
                        'amazon/amazon-ecs-sample'
                    ),
                },
                publicLoadBalancer: true,
            }
        );

        const scaleOutECSServiceDocument = new ssm.CfnDocument(
            this,
            'ScaleOutECSServiceDocument',
            {
                name: 'ScaleOutECSService',
                documentType: 'Automation',
                content: {
                    schemaVersion: '0.3',
                    description: 'ECS service scaleout automation runbook',
                    parameters: {
                        EcsClusterName: {
                            type: 'String',
                            default: ecs_service.cluster.clusterName,
                        },
                        EcsServiceName: {
                            type: 'String',
                            default: ecs_service.service.serviceName,
                        },
                        DesiredCount: {
                            type: 'Integer',
                            default: 2,
                        },
                    },
                    mainSteps: [
                        {
                            name: 'ECS',
                            action: 'aws:executeAwsApi',
                            inputs: {
                                Service: 'ecs',
                                Api: 'UpdateService',
                                cluster: '{{ EcsClusterName }}',
                                service: '{{ EcsServiceName }}',
                                desiredCount: '{{ DesiredCount }}',
                            },
                        },
                    ],
                },
            }
        );

        const scaleInECSServiceDocument = new ssm.CfnDocument(
            this,
            'ScaleInECSServiceDocument',
            {
                name: 'ScaleInECSService',
                documentType: 'Automation',
                content: {
                    schemaVersion: '0.3',
                    description: 'ECS service scaleout automation runbook',
                    parameters: {
                        EcsClusterName: {
                            type: 'String',
                            default: ecs_service.cluster.clusterName,
                        },
                        EcsServiceName: {
                            type: 'String',
                            default: ecs_service.service.serviceName,
                        },
                        DesiredCount: {
                            type: 'Integer',
                            default: 1,
                        },
                    },
                    mainSteps: [
                        {
                            name: 'ECS',
                            action: 'aws:executeAwsApi',
                            inputs: {
                                Service: 'ecs',
                                Api: 'UpdateService',
                                cluster: '{{ EcsClusterName }}',
                                service: '{{ EcsServiceName }}',
                                desiredCount: '{{ DesiredCount }}',
                            },
                        },
                    ],
                },
            }
        );
    }
}
