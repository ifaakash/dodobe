# login to AWS using boto3 library
import boto3
import botocore.config
import jmespath
import time
import botocore.exceptions

# AWS service to perform operation on
ec2_client= boto3.client('ec2',region_name='ap-south-1')

# list and describe all the ec2 instance within the account
response= ec2_client.describe_instances()

# Runner Instacne ID [ Instance ID : i-0f907580130be54f4 ]
def stop_runner(instance_id):
    try:
        print('Stopping the RUNNER Instance')
        ec2_client.stop_instances(InstanceIds=[instance_id])
        waiter= ec2_client.get_waiter('instance_stopped')
        waiter.wait(InstanceIds=[instance_id])
        print('Instace Stopped Successfully!')
    except Exception as e:
        return e

def main():
    # stop the runner
    stop_runner('i-04ff3d64d81bbf7b9') # New Runner Instance ID

if __name__=='__main__':
    main()
