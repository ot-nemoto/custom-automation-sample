import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class CustomAutomationSampleStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 1 });
        const sg = new ec2.SecurityGroup(this, 'SecurityGroup', {
            vpc,
            allowAllOutbound: true,
        });
        sg.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(80),
            'Allow HTTP traffic from anywhere'
        );

        const cluster = new ecs.Cluster(this, 'EcsCluster', {
            vpc,
            clusterName: 'custom-automation-sample-cluster',
        });
        const taskDefinition = new ecs.FargateTaskDefinition(
            this,
            'custom-automation-task-definition',
            {
                memoryLimitMiB: 512,
                cpu: 256,
            }
        );
        taskDefinition.addContainer('app', {
            image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
        });

        new ecs.FargateService(this, 'ProductionService', {
            serviceName: 'custom-automation-sample-service-production',
            cluster,
            taskDefinition,
            assignPublicIp: true,
            securityGroups: [sg],
        });

        new ecs.FargateService(this, 'StagingService', {
            serviceName: 'custom-automation-sample-service-staging',
            cluster,
            taskDefinition,
            assignPublicIp: true,
            securityGroups: [sg],
        });

        const scaleOutECSServiceDocument = new ssm.CfnDocument(
            this,
            'ChangeScaleECSServiceDocument',
            {
                name: 'ChangeScaleECSService',
                documentType: 'Automation',
                content: {
                    schemaVersion: '0.3',
                    description: 'change scale ECSService automation runbook',
                    parameters: {
                        Environment: {
                            type: 'String',
                            default: 'staging',
                            allowedValues: ['production', 'staging'],
                        },
                        Mode: {
                            type: 'String',
                            default: '節約',
                            allowedValues: ['節約', '通常', '高負荷'],
                        },
                    },
                    mainSteps: [
                        {
                            name: 'Branch',
                            action: 'aws:branch',
                            isEnd: true,
                            inputs: {
                                Choices: [
                                    {
                                        NextStep: 'UpdateServiceEconomy',
                                        Variable: '{{ Mode }}',
                                        StringEquals: '節約',
                                    },
                                    {
                                        NextStep: 'UpdateServiceRegular',
                                        Variable: '{{ Mode }}',
                                        StringEquals: '通常',
                                    },
                                    {
                                        NextStep: 'UpdateServiceHighLoad',
                                        Variable: '{{ Mode }}',
                                        StringEquals: '高負荷',
                                    },
                                ],
                            },
                        },
                        {
                            name: 'UpdateServiceEconomy',
                            action: 'aws:executeAwsApi',
                            isEnd: true,
                            inputs: {
                                Service: 'ecs',
                                Api: 'UpdateService',
                                cluster: cluster.clusterName,
                                service:
                                    'custom-automation-sample-service-{{ Environment }}',
                                desiredCount: 1,
                            },
                        },
                        {
                            name: 'UpdateServiceRegular',
                            action: 'aws:executeAwsApi',
                            isEnd: true,
                            inputs: {
                                Service: 'ecs',
                                Api: 'UpdateService',
                                cluster: cluster.clusterName,
                                service:
                                    'custom-automation-sample-service-{{ Environment }}',
                                desiredCount: 2,
                            },
                        },
                        {
                            name: 'UpdateServiceHighLoad',
                            action: 'aws:executeAwsApi',
                            isEnd: true,
                            inputs: {
                                Service: 'ecs',
                                Api: 'UpdateService',
                                cluster: cluster.clusterName,
                                service:
                                    'custom-automation-sample-service-{{ Environment }}',
                                desiredCount: 3,
                            },
                        },
                    ],
                },
            }
        );
    }
}
