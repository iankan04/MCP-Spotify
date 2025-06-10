import axios from 'axios';
import { refreshSpotifyToken } from '../src/auth';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('refreshSpotifyToken', () => {
  it('should return access token and expiration time', async () => {
    const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
            'content-type': 'application/json',
        },
        data: {
            access_token: 'mock_access_token',
            expires_in: 3600
        },
        config: {
            url: 'https://accounts.spotify.com/api/token'
        },
    };

    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const refreshToken = 'mock_refresh_token';
    const result = await refreshSpotifyToken(refreshToken);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://accounts.spotify.com/api/token',
        expect.any(String),
        expect.objectContaining({
            headers: expect.objectContaining({
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': expect.stringContaining('Basic ')
            })
        })
    );

    expect(result).toEqual({
      access_token: 'mock_access_token',
      expires_in: 3600
    });
  });
});
