import sys
import torch
import network

dqnControl = network.Dqn(5, 4, 0.85)


def int_to_bool_list(num):
    return [bool(num & (1 << n)) for n in range(4)]


for line in sys.stdin:
    stateStringArray = line.strip().split(",")
    stateArray = [float(numericString) for numericString in stateStringArray]

    nextAction = dqnControl.update(stateArray[0], stateArray[1:])
    print(int(nextAction))
