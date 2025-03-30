# login to AWS using boto3 library
import boto3
import botocore.config
import jmespath
import time
import botocore.exceptions

#boto3.set_stream_logger('')
#config= botocore.config.Config(parameter_validation= True)

# AWS service to perform operation on
ec2_client= boto3.client('ec2',region_name='ap-south-1')

# list and describe all the ec2 instance within the account
response= ec2_client.describe_instances()

#output= jmespath.search('Reservations[].Instances[].InstanceId',response)

# check the status of ec2 instance


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

# def stop_runner(instance_id):
#     try:
#         print('Stopping the RUNNER Instance')
#         ec2_client.stop_instances(InstanceIds=[instance_id])
#         print('debugee')
#         waiter= ec2_client.get_waiter('instance_stopped')
#         print('debugee')
#         waiter.wait(InstanceIds=[instance_id])
#         print('Instace Stopped Successfully!')
#     except Exception as e:
#         return e

def main():
    # start the runner
    start_runner('i-007ff4cc767a25bae') # New Runner Instance ID

    # wait for 5 min
    #print("Waiting for 5min....")
    #time.sleep(300)

    # stop the runner
    # stop_runner('i-0e450d48fc7779053')

# DEV environment ID [ Instance ID: i-0f907580130be54f4 ]

if __name__=='__main__':
    main()
