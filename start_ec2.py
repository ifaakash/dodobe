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
def start_runner(instance_id):
    try:
        print('Starting the RUNNER Instance')
        ec2_client.start_instances(InstanceIds= [instance_id])
        waiter= ec2_client.get_waiter('instance_running')
        waiter.wait(InstanceId=[instance_id])
        print("Runner Instance is UP and running!!")
    except Exception as e:
        return f"Error occured in the function: ${e}"

def main():
    # start the runner
    start_runner('i-04ff3d64d81bbf7b9') # New Runner Instance ID

if __name__=='__main__':
    main()
