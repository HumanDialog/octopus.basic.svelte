
const octopusTestUsers = [
    {
        username: "alice@example.com",
        role: 'supervisor',
        groupId: 13
    },
    {
        username: "bob@example.com",
        role: 'supervisor',
        groupId: 13
    }
]



function getAppUsers(setName)
{
    switch(setName)
    {
    case 'octopus':
        return octopusTestUsers;

    }
}

export const appUsers = getAppUsers(__USERS_SET__)
